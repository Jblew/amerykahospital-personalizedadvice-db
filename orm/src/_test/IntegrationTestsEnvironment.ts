// tslint:disable no-console max-classes-per-file
import * as firebaseTesting from "@firebase/testing";

export class IntegrationTestsEnvironment {
    public firestore!: firebaseTesting.firestore.Firestore;
    public database!: firebaseTesting.database.Database;
    public appFactory = firebaseTesting;
    private databaseRules: string | undefined;

    public prepareEach(p: { admin: boolean } = { admin: true }) {
        const databaseName = "db-" + Date.now();
        let app: firebase.app.App;
        if (p.admin) {
            app = firebaseTesting.initializeAdminApp({
                projectId: "unit-testing-" + Date.now(),
                databaseName,
            });
        } else {
            app = firebaseTesting.initializeTestApp({
                projectId: "unit-testing-" + Date.now(),
                databaseName,
            });
        }
        this.firestore = app.firestore();

        if (this.databaseRules) {
            firebaseTesting.loadDatabaseRules({
                databaseName,
                rules: this.databaseRules,
            });
        }
        this.database = app.database();
    }

    public async cleanupEach() {
        try {
            await Promise.all(firebaseTesting.apps().map(app => app.delete()));
        } catch (error) {
            console.warn("Warning: Error in firebase shutdown " + error);
        }
        this.firestore = undefined as any;
    }

    public setDatabaseRules(rules: string) {
        this.databaseRules = rules;
    }
}
