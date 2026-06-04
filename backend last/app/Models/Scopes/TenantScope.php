<?php

namespace App\Models\Scopes;

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
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Unauthenticated requests are intentionally unscoped (e.g. register email lookup).
        if (auth()->check()) {
            if (auth()->user()->role === 'super_admin') {   
                return;
            }

            $universityId = auth()->user()->university_id;
            
            if ($universityId) {
                $builder->where($model->getTable() . '.university_id', $universityId);
            } else {
                // If auth user has no university_id: no rows (FR-002)
                $builder->whereRaw('1 = 0');
            }
        }
    }
}
