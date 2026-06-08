<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AITaskControllerTest extends TestCase
{
    use DatabaseTransactions;

    private University $university;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.gemini.api_key' => 'test-key',
            'services.gemini.endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        ]);

        $this->university = University::firstOrCreate(
            ['slug' => 'test-uni-feature'],
            ['name' => 'Test University Feature'],
        );
    }

    /** @test */
    public function generate_tasks_returns_ten_ai_tasks_for_project_owner(): void
    {
        $this->fakeGeminiResponse();

        $user = $this->makeStudent();
        $project = $this->makeProject($user);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/generate-tasks");

        $response->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonCount(10, 'data.tasks');

        foreach ($response->json('data.tasks') as $task) {
            $this->assertTrue($task['ai_generated']);
            $this->assertGreaterThan(0, $task['estimated_hours']);
        }

        $this->assertEquals(40, $response->json('data.total_estimated_hours'));
    }

    /** @test */
    public function regenerate_returns_422_when_ai_tasks_were_started(): void
    {
        $user = $this->makeStudent();
        $project = $this->makeProject($user);

        Task::create([
            'project_id' => $project->id,
            'university_id' => $project->university_id,
            'title' => 'Started AI Task',
            'description' => 'Started description',
            'ai_generated' => true,
            'status' => 'in_progress',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/generate-tasks", [
            'regenerate' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath(
                'errors.regenerate.0',
                'Cannot regenerate tasks after AI-generated tasks have been started or completed.',
            );
    }

    /** @test */
    public function generate_tasks_returns_403_for_unauthorized_student(): void
    {
        $owner = $this->makeStudent();
        $otherStudent = $this->makeStudent();
        $project = $this->makeProject($owner);

        Sanctum::actingAs($otherStudent);

        $response = $this->postJson("/api/projects/{$project->id}/generate-tasks");

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You do not have access to this project');
    }

    /** @test */
    public function pending_project_member_cannot_generate_tasks(): void
    {
        $owner = $this->makeStudent();
        $pendingMember = $this->makeStudent();
        $project = $this->makeProject($owner);

        DB::table('project_members')->insert([
            'project_id' => $project->id,
            'student_id' => $pendingMember->id,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($pendingMember);

        $response = $this->postJson("/api/projects/{$project->id}/generate-tasks");

        $response->assertStatus(403);
    }

    /** @test */
    public function generate_tasks_returns_422_for_short_description(): void
    {
        $user = $this->makeStudent();
        $project = $this->makeProject($user, 'Too short');

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/generate-tasks");

        $response->assertStatus(422)
            ->assertJsonPath('errors.description.0', 'Project description must be at least 20 characters to generate tasks.');
    }

    /** @test */
    public function duplicate_generate_without_regenerate_returns_422(): void
    {
        $this->fakeGeminiResponse();

        $user = $this->makeStudent();
        $project = $this->makeProject($user);

        Task::create([
            'project_id' => $project->id,
            'university_id' => $project->university_id,
            'title' => 'Existing AI Task',
            'description' => 'Existing description',
            'ai_generated' => true,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/generate-tasks");

        $response->assertStatus(422)
            ->assertJsonPath('errors.regenerate.0', 'AI tasks already exist. Set regenerate=true to replace them.');
    }

    private function fakeGeminiResponse(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'tasks' => $this->sampleAiTasks(),
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    private function sampleAiTasks(): array
    {
        $tasks = [];
        for ($i = 1; $i <= 10; $i++) {
            $tasks[] = [
                'title' => "Task {$i}",
                'description' => "Description {$i}",
                'estimated_hours' => 4,
            ];
        }

        return $tasks;
    }

    private function makeStudent(): User
    {
        $role = Role::firstOrCreate(['name' => 'student']);

        return User::create([
            'name' => 'Feature Student',
            'email' => 'feature-student-' . uniqid() . '@test.local',
            'password' => bcrypt('password'),
            'role_id' => $role->id,
            'university_id' => $this->university->id,
            'status' => 'active',
        ]);
    }

    private function makeProject(User $user, string $description = 'A detailed project description that is long enough to pass validation checks.'): Project
    {
        return Project::create([
            'title' => 'Feature Test Project',
            'description' => $description,
            'user_id' => $user->id,
            'university_id' => $user->university_id,
            'status' => 'active',
        ]);
    }
}
