<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Models\University;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Applied to Eloquent models; static calls resolve to {@see Model}.
 *
 * @mixin Model
 */
trait BelongsToUniversity
{
    /** Registers tenant scope and auto-fills university_id on create. */
    protected static function bootBelongsToUniversity(): void
    {
        /** @var class-string<Model> $modelClass */
        $modelClass = static::class;
        $modelClass::addGlobalScope(new TenantScope);

        $modelClass::creating(function (Model $model) {
            if (auth()->check() && empty($model->university_id)) {
                $model->university_id = auth()->user()->university_id;
            }
        });
    }

    /** Returns the university this model belongs to. */
    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }
}
