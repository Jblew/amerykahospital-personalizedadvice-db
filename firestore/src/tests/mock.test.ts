// tslint:disable no-console
import * as firebase from "@firebase/testing";
import FirestoreRoles from "firestore-roles";
import * as fs from "fs";
import * as path from "path";
import uuid from "uuid/v4";

import { Advice, PendingMedicalProfessional, RolesConfig } from "../context";

const firestoreRules = fs.readFileSync(path.resolve(__dirname, "../../deploy.firestore.rules"), "utf8");

export async function mock(o: { clientAuth?: {} }) {
    const projectId = "unit-testing-" + Date.now();

    const clientAppConfig: any = { projectId };
    if (o.clientAuth) clientAppConfig.auth = o.clientAuth;
    const clientApp = firebase.initializeTestApp(clientAppConfig);
    const clientFirestore = clientApp.firestore();

    await firebase.loadFirestoreRules({
        projectId,
        rules: firestoreRules,
    });

    const adminApp = firebase.initializeAdminApp({ projectId });
    const adminFirestore = adminApp.firestore();

    function adminDoc(collection: string, doc: string) {
        return adminFirestore.collection(collection).doc(doc);
    }

    function clientDoc(collection: string, doc: string) {
        return clientFirestore.collection(collection).doc(doc);
    }

    const adminRoles = new FirestoreRoles(RolesConfig, adminFirestore);

    async function enableRole(uid: string, role: string) {
        return adminRoles.enableRole(uid, role);
    }

    return {
        projectId,
        clientApp,
        adminApp,
        clientFirestore,
        adminFirestore,
        adminDoc,
        clientDoc,
        enableRole,
    };
}

export async function cleanupFirebase() {
    {
        try {
            await Promise.all(firebase.apps().map(app => app.delete()));
        } catch (error) {
            console.warn("Warning: Error in firebase shutdown " + error);
        }
    }
}

export function sampleAdvice(uid?: string) {
    const advice: Advice = {
        id: uuid(),
        patientName: "patient-" + uuid(),
        medicalprofessionalName: "medicalprofessional-" + uuid(),
        parentPhoneNumber: "123123123",
        advice: "advice-" + uuid(),
        timestamp: Date.now() / 1000,
    };
    if (uid) advice.uid = uid; // firebase catches the difference between undefined and nonexistent attr
    return advice;
}

export function sampleMedicalProfessional(): PendingMedicalProfessional {
    return {
        displayName: `displayname-${uuid()}`,
    };
}
