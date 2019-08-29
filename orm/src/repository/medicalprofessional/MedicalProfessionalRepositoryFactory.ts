import { MedicalProfessionalRepository } from "amerykahospital-personalizedadvice-businesslogic";

import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

import { MedicalProfessionalRepositoryImpl } from "./MedicalProfessionalRepositoryImpl";

export namespace MedicalProfessionalRepositoryFactory {
    export function make(firestore: FirestoreEquivalent): MedicalProfessionalRepository {
        return new MedicalProfessionalRepositoryImpl(firestore);
    }
}
