interface Params {
    /** The size of the component */
    size: "small" | "medium" | "large";

    /** Must be a positive number */
    id: number;

    /** Indicates if active or inactive */
    status: "active" | "inactive";

    /** 
     * Defines the UI theme 
     * @default light 
     **/
    theme?: "light" | "dark";

    /**
     * The main user role.
     * This defines the level of access a user has in the system.
     *
     * @description Role of the user
     * @default user
     */
    role?: "admin" | `editor` | "user";
}