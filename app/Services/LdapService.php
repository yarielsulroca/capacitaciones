<?php

namespace App\Services;

class LdapService
{
    protected $connection;

    public function __construct()
    {
        $this->connection = ldap_connect(config('services.ldap.host'), config('services.ldap.port'));
        ldap_set_option($this->connection, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($this->connection, LDAP_OPT_REFERRALS, 0);
    }

    /**
     * Authenticate a user against LDAP.
     */
    public function authenticate($username, $password)
    {
        \Illuminate\Support\Facades\Log::info("LDAP: Attempting authentication for $username");

        if (!$this->bindSystem()) {
            \Illuminate\Support\Facades\Log::error("LDAP: System bind failed for " . config('services.ldap.username'));
            return false;
        }

        $filter = "(samaccountname=$username)";
        $search = ldap_search($this->connection, config('services.ldap.base_dn'), $filter);
        $entries = ldap_get_entries($this->connection, $search);

        if ($entries['count'] === 0) {
            \Illuminate\Support\Facades\Log::warning("LDAP: User not found for filter $filter");
            return false;
        }

        $userDn = $entries[0]['dn'];
        \Illuminate\Support\Facades\Log::info("LDAP: Found DN: $userDn. Attempting bind...");

        if (@ldap_bind($this->connection, $userDn, $password)) {
            \Illuminate\Support\Facades\Log::info("LDAP: Authentication successful for $username");
            return $entries[0];
        }

        \Illuminate\Support\Facades\Log::warning("LDAP: Authentication failed (bind) for $username");
        return false;
    }

    protected function bindSystem()
    {
        return @ldap_bind(
            $this->connection,
            config('services.ldap.username'),
            config('services.ldap.password')
        );
    }

    /**
     * Extract attributes from LDAP entry.
     */
    public function getAttributes($entry)
    {
        return [
            'name' => $entry['displayname'][0] ?? $entry['cn'][0] ?? null,
            'email' => $entry['mail'][0] ?? null,
            'department' => $entry['department'][0] ?? null,
            'title' => $entry['title'][0] ?? null, // Cargo
            'area' => $entry['description'][0] ?? $entry['physicaldeliveryofficename'][0] ?? null,
        ];
    }
}
