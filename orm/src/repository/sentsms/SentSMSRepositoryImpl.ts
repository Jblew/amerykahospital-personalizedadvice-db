import { PendingSentSMS, SentSMS, SentSMSRepository } from "amerykahospital-personalizedadvice-businesslogic";
import uuid from "uuid/v4";

import { FirestoreCollectionKeys } from "../../config/FirestoreCollectionKeys";
import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

export class SentSMSRepositoryImpl implements SentSMSRepository {
    private firestore: FirestoreEquivalent;

    public constructor(firestore: FirestoreEquivalent) {
        this.firestore = firestore;
    }

    public async add(sentSMS: PendingSentSMS): Promise<{ id: string }> {
        PendingSentSMS.validate(sentSMS);
        const recordToAdd = {
            id: uuid(),
            timestamp: Math.floor(Date.now() / 1000),
            ...sentSMS,
        };
        await this.getDoc(recordToAdd.id).set(recordToAdd);
        return { id: recordToAdd.id };
    }

    public async get(id: string): Promise<SentSMS | undefined> {
        const doc = await this.getDoc(id).get();
        if (!doc.exists) return undefined;
        const sentSMS = doc.data() as SentSMS;
        SentSMS.validate(sentSMS);
        return sentSMS;
    }

    private getCol(): FirestoreEquivalent.CollectionReferenceEquivalent {
        return this.firestore.collection(FirestoreCollectionKeys.SENT_SMS_MESSAGES_COLLECTION_KEY);
    }

    private getDoc(id: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.getCol().doc(id);
    }
}
