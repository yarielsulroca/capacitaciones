<?php

namespace App\Console\Commands;

use App\Services\CourseService;
use Illuminate\Console\Command;

class ProcessCourseWorkflows extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'courses:process-workflows';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process automatic course transitions (Terminado) and delayed notifications (6-day rule).';

    /**
     * Execute the console command.
     */
    public function handle(CourseService $courseService)
    {
        $this->info('Processing course transitions and notifications...');
        $courseService->processCourseTransitions();
        $this->info('Done!');
    }
}
