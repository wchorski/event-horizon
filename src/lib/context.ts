import type { CrudRegistryType } from "./crudRegistry";

// TODO remove if not needed
export function getContext(formData: FormData) {
    const crud = formData.get("_crud") as CrudRegistryType;
    if (!crud) throw new Error("crud not found");
    const config = JSON.parse(formData.get("_config") as string);
    if (!config) throw new Error("config not found");
    const endpoint = formData.get("_endpoint") as string;
    const headers = Object.keys(config);
    return { config, crud, endpoint, headers };
}