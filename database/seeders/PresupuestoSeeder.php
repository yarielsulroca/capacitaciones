<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Presupuesto;
use Illuminate\Database\Seeder;

class PresupuestoSeeder extends Seeder
{
    /**
     * Seed presupuestos de capacitación organizados por área y departamento.
     */
    public function run(): void
    {
        // Usar la primera empresa existente o crearla
        $empresa = Empresa::firstOrCreate(
            ['nombre' => 'Tuteur S.A.'],
            ['direccion' => 'Av. Principal 1234, Buenos Aires']
        );

        // Definición de áreas con sus departamentos y presupuestos anuales
        $estructuraOrganizacional = [
            [
                'area' => [
                    'nombre'      => 'Capital Humano',
                    'descripcion' => 'Gestión del talento, reclutamiento, capacitación y desarrollo organizacional.',
                ],
                'departamentos' => [
                    ['nombre' => 'Reclutamiento y Selección',  'descripcion' => 'Atracción y selección de talento humano.',         'presupuesto_2025' => 850000,  'presupuesto_2026' => 920000],
                    ['nombre' => 'Capacitación y Desarrollo',  'descripcion' => 'Programas de formación y desarrollo de personal.',  'presupuesto_2025' => 1200000, 'presupuesto_2026' => 1400000],
                    ['nombre' => 'Compensaciones y Beneficios', 'descripcion' => 'Administración de sueldos y beneficios.',           'presupuesto_2025' => 500000,  'presupuesto_2026' => 550000],
                ],
            ],
            [
                'area' => [
                    'nombre'      => 'Tecnología e Innovación',
                    'descripcion' => 'Infraestructura tecnológica, desarrollo de software e innovación digital.',
                ],
                'departamentos' => [
                    ['nombre' => 'Desarrollo de Software',  'descripcion' => 'Construcción y mantenimiento de sistemas internos.',    'presupuesto_2025' => 1500000, 'presupuesto_2026' => 1750000],
                    ['nombre' => 'Infraestructura y Redes', 'descripcion' => 'Gestión de servidores, redes y seguridad informática.', 'presupuesto_2025' => 900000,  'presupuesto_2026' => 980000],
                    ['nombre' => 'Soporte Técnico',         'descripcion' => 'Asistencia técnica a usuarios internos.',               'presupuesto_2025' => 420000,  'presupuesto_2026' => 450000],
                ],
            ],
            [
                'area' => [
                    'nombre'      => 'Finanzas y Administración',
                    'descripcion' => 'Control financiero, contabilidad y gestión administrativa.',
                ],
                'departamentos' => [
                    ['nombre' => 'Contabilidad General',  'descripcion' => 'Registro contable y estados financieros.',         'presupuesto_2025' => 700000,  'presupuesto_2026' => 730000],
                    ['nombre' => 'Tesorería',             'descripcion' => 'Gestión de flujo de caja y pagos.',                'presupuesto_2025' => 480000,  'presupuesto_2026' => 500000],
                    ['nombre' => 'Control de Gestión',   'descripcion' => 'Análisis de costos y control presupuestario.',     'presupuesto_2025' => 560000,  'presupuesto_2026' => 610000],
                    ['nombre' => 'Impuestos',             'descripcion' => 'Cumplimiento tributario y planificación fiscal.',  'presupuesto_2025' => 320000,  'presupuesto_2026' => 340000],
                ],
            ],
            [
                'area' => [
                    'nombre'      => 'Comercial y Marketing',
                    'descripcion' => 'Estrategia comercial, ventas y posicionamiento de marca.',
                ],
                'departamentos' => [
                    ['nombre' => 'Ventas',                   'descripcion' => 'Gestión de la fuerza de ventas y clientes.',          'presupuesto_2025' => 1100000, 'presupuesto_2026' => 1250000],
                    ['nombre' => 'Marketing Digital',        'descripcion' => 'Estrategias de marketing online y redes sociales.',   'presupuesto_2025' => 780000,  'presupuesto_2026' => 890000],
                    ['nombre' => 'Estrategia Comercial',     'descripcion' => 'Planificación y desarrollo de nuevos mercados.',      'presupuesto_2025' => 650000,  'presupuesto_2026' => 720000],
                    ['nombre' => 'Administración de Ventas', 'descripcion' => 'Soporte administrativo al equipo comercial.',         'presupuesto_2025' => 380000,  'presupuesto_2026' => 400000],
                ],
            ],
            [
                'area' => [
                    'nombre'      => 'Operaciones y Producción',
                    'descripcion' => 'Planificación operativa, producción y control de calidad.',
                ],
                'departamentos' => [
                    ['nombre' => 'Producción',          'descripcion' => 'Procesos de manufactura y producción.',              'presupuesto_2025' => 2000000, 'presupuesto_2026' => 2200000],
                    ['nombre' => 'Control de Calidad',  'descripcion' => 'Aseguramiento y control de calidad de productos.',   'presupuesto_2025' => 850000,  'presupuesto_2026' => 920000],
                    ['nombre' => 'Logística y Supply Chain', 'descripcion' => 'Gestión de la cadena de suministro y distribución.', 'presupuesto_2025' => 1100000, 'presupuesto_2026' => 1200000],
                    ['nombre' => 'Compras y Abastecimiento', 'descripcion' => 'Adquisición de materiales y negociación con proveedores.', 'presupuesto_2025' => 680000,  'presupuesto_2026' => 720000],
                ],
            ],
            [
                'area' => [
                    'nombre'      => 'Dirección Médica',
                    'descripcion' => 'Supervisión médica, regulatoria y de calidad en salud.',
                ],
                'departamentos' => [
                    ['nombre' => 'Oncología y Hematología', 'descripcion' => 'Especialidad médica oncológica.',              'presupuesto_2025' => 950000,  'presupuesto_2026' => 1050000],
                    ['nombre' => 'Registros Médicos',       'descripcion' => 'Gestión de expedientes y registros sanitarios.', 'presupuesto_2025' => 430000,  'presupuesto_2026' => 460000],
                    ['nombre' => 'QA Regulatorio',          'descripcion' => 'Cumplimiento regulatorio y aseguramiento QA.',    'presupuesto_2025' => 580000,  'presupuesto_2026' => 630000],
                ],
            ],
            [
                'area' => [
                    'nombre'      => 'Business Development',
                    'descripcion' => 'Expansión de negocios, alianzas estratégicas y nuevas unidades de negocio.',
                ],
                'departamentos' => [
                    ['nombre' => 'Acceso al Mercado', 'descripcion' => 'Estrategias de acceso y posicionamiento en nuevos mercados.', 'presupuesto_2025' => 870000,  'presupuesto_2026' => 990000],
                    ['nombre' => 'Alianzas y Partnerships', 'descripcion' => 'Gestión de alianzas comerciales y estratégicas.',       'presupuesto_2025' => 620000,  'presupuesto_2026' => 700000],
                ],
            ],
        ];

        $añosPresupuesto = [2025, 2026];

        foreach ($estructuraOrganizacional as $estructura) {
            // Crear o recuperar el área
            $area = Area::firstOrCreate(
                [
                    'nombre'     => $estructura['area']['nombre'],
                    'id_empresa' => $empresa->id,
                ],
                [
                    'descripcion' => $estructura['area']['descripcion'],
                ]
            );

            foreach ($estructura['departamentos'] as $depData) {
                // Crear o recuperar el departamento
                $departamento = Departamento::firstOrCreate(
                    [
                        'nombre'  => $depData['nombre'],
                        'id_area' => $area->id,
                    ],
                    ['descripcion' => $depData['descripcion']]
                );

                // Crear presupuestos para cada año
                // Nota: el campo 'fecha' en la DB es INT (almacena el año como entero)
                // porque la migración renombró 'anio' sin cambiar el tipo en SQL Server
                foreach ($añosPresupuesto as $año) {
                    $montoKey = "presupuesto_{$año}";

                    Presupuesto::firstOrCreate(
                        [
                            'fecha'           => $año,  // año como entero (INT en SQL Server)
                            'id_departamento' => $departamento->id,
                        ],
                        [
                            'inicial' => $depData[$montoKey],
                            'actual'  => $depData[$montoKey], // El saldo inicial y actual son iguales al crearlo
                        ]
                    );
                }
            }
        }

        $this->command->info('✅ PresupuestoSeeder completado: ' . count($estructuraOrganizacional) . ' áreas seedeadas con sus departamentos y presupuestos 2025-2026.');
    }
}
