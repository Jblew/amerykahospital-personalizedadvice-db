import { Advice, AdviceRepository } from "amerykahospital-personalizedadvice-businesslogic";
import firebase from "firebase/app";

import { FirestoreCollectionKeys } from "../../../../FirestoreCollectionKeys";
import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

export class AdviceRepositoryImpl implements AdviceRepository {
    private firestore: FirestoreEquivalent;

    public constructor(firestore: FirestoreEquivalent) {
        this.firestore = firestore;
    }

    public async addAdvice(advice: Advice) {
        Advice.validate(advice);
        await this.getAdviceDoc(advice.id).set(advice);
    }

    public async getAdvice(id: string): Promise<Advice | undefined> {
        const doc = await this.getAdviceDoc(id).get();
        if (!doc.exists) return undefined;
        const advice = doc.data() as Advice;
        Advice.validate(advice);
        return advice;
    }

    public async adviceExists(id: string): Promise<boolean> {
        return (await this.getAdviceDoc(id).get()).exists;
    }

    public async fetchAdvices(filter: AdviceRepository.FetchFilter): Promise<Advice[]> {
        let query: firebase.firestore.Query = firebase
            .firestore()
            .collection(FirestoreCollectionKeys.ADVICES_COLLECTION_KEY);

        if (filter.medicalprofessionalName) {
            query = this.createStartsWithQueryClause(
                query,
                Advice.keys.medicalprofessionalName,
                filter.medicalprofessionalName,
            );
        }

        if (filter.patientName) {
            query = this.createStartsWithQueryClause(query, Advice.keys.patientName, filter.patientName);
        }

        if (filter.parentPhoneNumber) {
            query = this.createStartsWithQueryClause(query, Advice.keys.parentPhoneNumber, filter.parentPhoneNumber);
        }

        query = query.orderBy(Advice.keys.timestamp, "desc");

        query = query.limit(20);

        const querySnapshot = await query.get();

        const advices: Advice[] = [];

        querySnapshot.forEach(document => advices.push((document.data() as any) as Advice));

        return advices as Advice[];
    }

    private getAdviceDoc(adviceId: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.firestore.collection(FirestoreCollectionKeys.ADVICES_COLLECTION_KEY).doc(adviceId);
    }

    private createStartsWithQueryClause(
        queryObj: firebase.firestore.CollectionReference | firebase.firestore.Query,
        fieldName: string,
        startingStr: string,
    ): firebase.firestore.Query {
        const strlength = startingStr.length;
        const strFrontCode = startingStr.slice(0, strlength - 1);
        const strEndCode = startingStr.slice(strlength - 1, startingStr.length);

        const startcode = startingStr;
        const endcode = strFrontCode + String.fromCharCode(strEndCode.charCodeAt(0) + 1);
        return queryObj
            .where(fieldName, ">=", startcode)
            .where(fieldName, "<", endcode)
            .orderBy(fieldName, "desc");
    }
}

export namespace AdviceRepository {
    export interface FetchFilter {
        medicalprofessionalName?: string;
        patientName?: string;
        parentPhoneNumber?: string;
    }
}
