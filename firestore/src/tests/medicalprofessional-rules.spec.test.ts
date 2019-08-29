/* tslint:disable:max-classes-per-file no-console */
import * as firebase from "@firebase/testing";

import { Advice, FirestoreCollectionKeys, RoleKey } from "../context";

import { _, expect, uuid } from "./_testenv/test_environment";
import { cleanupFirebase, mock, sampleAdvice, sampleMedicalProfessional } from "./mock.test";

describe("Firestore rules", function() {
    this.timeout(6000);

    afterEach(async () => await cleanupFirebase());

    describe("Collection " + FirestoreCollectionKeys.MEDICALPROFESSIONAL_COLLECTION_KEY, () => {
        const collName = FirestoreCollectionKeys.MEDICALPROFESSIONAL_COLLECTION_KEY;
        describe("get", () => {
            it("Is not allowed when user is not authenticated", async () => {
                const { adminDoc, clientDoc } = await mock({ clientAuth: undefined });
                await adminDoc(collName, "doc").set(sampleMedicalProfessional());

                await expect(clientDoc(collName, "doc").get()).to.eventually.be.rejectedWith("false");
            });

            it("Is allowed when user is authenticated", async () => {
                const uid = `user${uuid()}`;
                const { adminDoc, clientDoc } = await mock({ clientAuth: { uid } });
                await adminDoc(collName, "doc").set(sampleMedicalProfessional());

                await expect(clientDoc(collName, "doc").get()).to.eventually.be.fulfilled.and.be.an("object");
            });
        });

        describe("list", () => {
            it("Is not allowed when user is not authenticated", async () => {
                const { adminDoc, clientFirestore } = await mock({ clientAuth: undefined });
                await adminDoc(collName, "doc").set(sampleMedicalProfessional());

                await expect(clientFirestore.collection(collName).get()).to.eventually.be.rejectedWith("false");
            });

            it("Is allowed when user is authenticated", async () => {
                const uid = `user${uuid()}`;
                const { adminDoc, clientFirestore } = await mock({ clientAuth: { uid } });
                await adminDoc(collName, "doc").set(sampleMedicalProfessional());

                await expect(clientFirestore.collection(collName).get()).to.eventually.be.fulfilled.and.be.an("object");
            });
        });

        ["create", "update", "delete"].forEach(test =>
            describe(test, () => {
                const docName = "doc";
                it("Is not allowed when user is not authenticated", async () => {
                    const { clientFirestore, adminDoc } = await mock({ clientAuth: undefined });
                    if (test === "update") {
                        await adminDoc(collName, docName).set({ da: "ta" });
                    }

                    const ref = clientFirestore.collection(collName).doc(docName);
                    const op = test === "delete" ? ref.delete() : ref.set({ da: "ta" });
                    await expect(op).to.eventually.be.rejectedWith("false");
                });

                it("Is not allowed when user is not provisioner but is authenticated", async () => {
                    const uid = `user${uuid()}`;
                    const { clientFirestore, enableRole, adminDoc } = await mock({ clientAuth: { uid } });
                    await enableRole(uid, RoleKey.medicalprofessional);
                    if (test === "update") {
                        await adminDoc(collName, docName).set({ da: "ta" });
                    }

                    const ref = clientFirestore.collection(collName).doc(docName);
                    const op = test === "delete" ? ref.delete() : ref.set({ da: "ta" });
                    await expect(op).to.eventually.be.rejectedWith("false");
                });

                it("Is allowed when user is a provisioner", async () => {
                    const uid = `user${uuid()}`;
                    const { clientFirestore, enableRole, adminDoc } = await mock({ clientAuth: { uid } });
                    await enableRole(uid, RoleKey.provisioner);
                    if (test === "update") {
                        await adminDoc(collName, docName).set({ da: "ta" });
                    }

                    const ref = clientFirestore.collection(collName).doc(docName);
                    const op = test === "delete" ? ref.delete() : ref.set({ da: "ta" });
                    await expect(op).to.eventually.be.fulfilled;
                });
            }),
        );
    });
});
