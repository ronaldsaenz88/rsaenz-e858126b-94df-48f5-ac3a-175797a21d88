export interface Task {
    id?: number;
    title: string;
    description?: string;
    category: string;
    taskStatus: string;
    status?: string; // BaseEntity active/inactive status
    dueDate?: string;
}
