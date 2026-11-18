type RoleOption = { id: string; name: string; description: string; key: string };

export function RoleCheckboxes({ roles, selected = [], error }: { roles: RoleOption[]; selected?: string[]; error?: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-navy-900">Roles</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {roles.map((r) => (
          <label key={r.id} className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 hover:border-navy-200 has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50/60">
            <input type="checkbox" name="roleIds" value={r.id} defaultChecked={selected.includes(r.id)} className="mt-1 size-4 accent-navy-600" />
            <span>
              <span className="block text-sm font-semibold text-navy-900">{r.name}</span>
              <span className="block text-xs text-muted">{r.description}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </fieldset>
  );
}
