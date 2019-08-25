import { AdviceRepository } from "amerykahospital-personalizedadvice-businesslogic";

import { FirestoreEquivalent } from "../../types/FirestoreEquivalent";

import { AdviceRepositoryImpl } from "./AdviceRepositoryImpl";

export namespace AdviceRepositoryFactory {
    export function make(firestore: FirestoreEquivalent): AdviceRepository {
        return new AdviceRepositoryImpl(firestore);
    }
}
