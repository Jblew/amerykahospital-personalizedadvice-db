// tslint:disable no-console max-classes-per-file
import * as firebaseTesting from "@firebase/testing";

export class IntegrationTestsEnvironment {
    public firestore!: firebaseTesting.firestore.Firestore;

    public prepareEach() {
        const adminApp = firebaseTesting.initializeAdminApp({
            projectId: "unit-testing-" + Date.now(),
            databaseName: "db",
        });
        this.firestore = adminApp.firestore();
    }

    public async cleanupEach() {
        try {
            await Promise.all(firebaseTesting.apps().map(app => app.delete()));
        } catch (error) {
            console.warn("Warning: Error in firebase shutdown " + error);
        }
        this.firestore = undefined as any;
    }
}
