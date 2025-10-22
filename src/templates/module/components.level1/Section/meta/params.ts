// import React from "react";

/**
 * Props for AnotherComponent
 */
interface Params {
    /**
     * The main user role.
     * This defines the level of access a user has in the system.
     *
     * @description Role of the user
     * @default user
     */
    role?: "admin" | `editor` | "user";
}