<?php

namespace App\Models\Scopes;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * FORBIDDEN in Phase 1 (Multi-Tenancy Foundation):
 * - No university_id on comments, ratings, notifications, invitations, etc. (FR-014)
 * - No 403 Forbidden for cross-tenant ID access; MUST return 404 (FR-015)
 * - No admin bypass; TenantScope applies to all roles (FR-013)
 * - No /universities API endpoints (FR-016)
 */
class TenantScope implements Scope
{
    /** Restricts queries to the authenticated user's university, or none if unscoped. */
    public function apply(Builder $builder, Model $model): void
    {
        if (!auth()->check()) {
            return;
        }

        $user = auth()->user();
        if (!$user instanceof User) {
            return;
        }

        $user->loadMissing('role');

        if ($user->isSuperAdmin()) {
            return;
        }

        $universityId = $user->university_id;

        if ($universityId) {
            $builder->where($model->getTable() . '.university_id', $universityId);
        } else {
            $builder->whereRaw('1 = 0');
        }
    }
}
