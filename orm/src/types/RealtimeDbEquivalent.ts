export interface RealtimeDbEquivalent {
    ref(path?: string | any | undefined): RealtimeDbEquivalent.Reference;
}

export namespace RealtimeDbEquivalent {
    export interface Reference {
        transaction(
            updateFn: (data: any) => any,
            completeFn?: any,
        ): Promise<{ committed: boolean; snapshot: DataSnapshot | null }>;
        once(eventType: "value"): Promise<DataSnapshot>;

        limitToLast(limit: number): Query;
        orderByChild(path: string): Query;
        child(path: string): Reference;
        set(v: any): Promise<void>;
        equalTo(value: string | number | boolean, key?: string): Query;
        on(eventType: "child_added", cb: (curr: DataSnapshot) => void): void;
        off(eventType: "child_added", cb: (curr: DataSnapshot) => void): void;
    }

    export interface Query {
        orderByChild(path: string): Query;
        limitToLast(limit: number): Query;
        equalTo(value: string | number | boolean, key?: string): Query;
        once(eventType: "value"): Promise<DataSnapshot>;
        on(eventType: "child_added", cb: (curr: DataSnapshot) => void): void;
        off(eventType: "child_added", cb: (curr: DataSnapshot) => void): void;
    }

    export interface DataSnapshot {
        val(): any;
        exists(): boolean;
    }
}
