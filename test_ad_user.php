<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function utf8ize($mixed) {
    if (is_array($mixed)) {
        foreach ($mixed as $key => $value) {
            $mixed[$key] = utf8ize($value);
        }
    } else if (is_string ($mixed)) {
        return mb_convert_encoding($mixed, "UTF-8", "auto");
    }
    return $mixed;
}

try {
    $connection = ldap_connect(config('services.ldap.host'), config('services.ldap.port'));
    ldap_set_option($connection, LDAP_OPT_PROTOCOL_VERSION, 3);
    ldap_set_option($connection, LDAP_OPT_REFERRALS, 0);

    $bind = @ldap_bind($connection, config('services.ldap.username'), config('services.ldap.password'));

    $filter = '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))';
    $search = @ldap_search($connection, config('services.ldap.base_dn'), $filter, array(), 0, 100);

    $entries = ldap_get_entries($connection, $search);

    $foundEntry = null;
    for ($i=0; $i<$entries['count']; $i++) {
        $entry = $entries[$i];
        if (isset($entry['mail']) && isset($entry['title'])) {
            $foundEntry = $entry;
            break;
        }
        if ($i > 50 && $foundEntry === null) {
            $foundEntry = $entry; // fallback
        }
    }

    if ($foundEntry) {
        $clean = [];
        for ($i=0; $i<$foundEntry['count']; $i++) {
            $attr = $foundEntry[$i];

            if (in_array($attr, ['objectguid', 'objectsid', 'logonhours', 'msexchmailboxsecuritydescriptor', 'usncrypt', 'jpegphoto', 'thumbnailphoto'])) {
                continue;
            }

            if (isset($foundEntry[$attr]) && $foundEntry[$attr]['count'] > 0) {
                if ($foundEntry[$attr]['count'] == 1) {
                    $clean[$attr] = $foundEntry[$attr][0];
                } else {
                    $clean[$attr] = array_slice($foundEntry[$attr], 0, $foundEntry[$attr]['count']);
                }
            }
        }

        $clean = utf8ize($clean);
        $json = json_encode($clean, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_IGNORE);

        file_put_contents('ad_output.json', $json);
        echo "Data written to ad_output.json";
    }

} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage();
}
