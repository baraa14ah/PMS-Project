<?php

namespace App\Models\Concerns;

use App\Models\University;
use Illuminate\Database\Eloquent\Builder;

trait HasUniversityVisibility
{
    public function supervisorUniversities()
    {
        return $this->belongsToMany(
            University::class,
            'supervisor_universities',
            'user_id',
            'university_id',
        );
    }

    public function isSupervisorRole(): bool
    {
        return $this->role && $this->role->name === 'supervisor';
    }

    public function syncSupervisorUniversities(array $universityIds): void
    {
        if (!$this->isSupervisorRole()) {
            return;
        }

        $ids = array_values(array_unique(array_filter(array_map('intval', $universityIds))));
        if (empty($ids) && $this->university_id) {
            $ids = [(int) $this->university_id];
        }

        if (!empty($ids)) {
            $this->supervisorUniversities()->sync($ids);
            if (!$this->university_id) {
                $this->forceFill(['university_id' => $ids[0]])->save();
            }
        }
    }

    public function scopeInUniversity(Builder $query, ?int $universityId = null): Builder
    {
        $universityId = $universityId ?? auth()->user()?->university_id;

        if (!$universityId) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $q) use ($universityId) {
            $q->where('users.university_id', $universityId)
                ->orWhereHas('supervisorUniversities', function (Builder $sq) use ($universityId) {
                    $sq->where('universities.id', $universityId);
                });
        });
    }

    public function scopeExcludePlatformAccounts(Builder $query): Builder
    {
        return $query->whereHas('role', function (Builder $q) {
            $q->whereNotIn('name', ['super_admin', 'admin']);
        });
    }

    public function scopeForTenantAdminListing(Builder $query, ?int $universityId = null): Builder
    {
        return $query
            ->inUniversity($universityId)
            ->excludePlatformAccounts()
            ->when(auth()->check(), fn (Builder $q) => $q->where('users.id', '!=', auth()->id()));
    }

    public function scopeApplyUserListFilters(Builder $query, $request): Builder
    {
        if ($request->filled('search')) {
            $term = '%' . trim($request->search) . '%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('users.name', 'like', $term)
                    ->orWhere('users.email', 'like', $term)
                    ->orWhere('users.student_number', 'like', $term);
            });
        }

        if ($request->filled('status')) {
            $query->where('users.status', $request->status);
        }

        if ($request->filled('role')) {
            $query->whereHas('role', fn (Builder $q) => $q->where('name', $request->role));
        }

        return $query;
    }
}
