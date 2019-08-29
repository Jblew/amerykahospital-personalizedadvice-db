import {
    AbstractMedicalProfessionalRepository,
    MedicalProfessional,
    MedicalProfessionalRepository,
} from "amerykahospital-personalizedadvice-businesslogic";
import uuid from "uuid/v4";

import { FirestoreCollectionKeys } from "../../config/FirestoreCollectionKeys";
import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

export class MedicalProfessionalRepositoryImpl extends AbstractMedicalProfessionalRepository
    implements MedicalProfessionalRepository {
    private firestore: FirestoreEquivalent;

    public constructor(firestore: FirestoreEquivalent) {
        super();
        this.firestore = firestore;
    }

    public async list(): Promise<MedicalProfessional[]> {
        const snapshot = await this.getCol()
            .orderBy(MedicalProfessional.keys.displayName)
            .get();
        const mps: MedicalProfessional[] = snapshot.docs
            .filter(d => d.exists)
            .map(d => d.data()! as MedicalProfessional)
            .filter(v => MedicalProfessional.isValid(v));
        return mps;
    }

    public async get(id: string): Promise<MedicalProfessional | undefined> {
        const doc = await this.getDoc(id).get();
        if (!doc.exists) return undefined;
        const medicalProfessional = doc.data() as MedicalProfessional;
        MedicalProfessional.validate(medicalProfessional);
        return medicalProfessional;
    }

    protected async writeMedicalProfessional(mp: MedicalProfessional): Promise<void> {
        MedicalProfessional.validate(mp);
        await this.getDoc(mp.id).set(mp);
    }

    protected getUuid(): string {
        return uuid();
    }

    private getCol(): FirestoreEquivalent.CollectionReferenceEquivalent {
        return this.firestore.collection(FirestoreCollectionKeys.MEDICALPROFESSIONAL_COLLECTION_KEY);
    }

    private getDoc(id: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.getCol().doc(id);
    }
}
