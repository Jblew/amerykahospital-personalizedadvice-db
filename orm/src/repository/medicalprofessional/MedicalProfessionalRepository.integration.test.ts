import {
    MedicalProfessionalRepository,
    PendingMedicalProfessional,
} from "amerykahospital-personalizedadvice-businesslogic";

import { IntegrationTestsEnvironment } from "../../_test/IntegrationTestsEnvironment";
import { _, expect, uuid } from "../../_test/test_environment";

import { MedicalProfessionalRepositoryFactory } from "./MedicalProfessionalRepositoryFactory";

describe("MedicalProfessionalRepository", function() {
    this.timeout(6000);

    const env = new IntegrationTestsEnvironment();
    let repository: MedicalProfessionalRepository;
    beforeEach(async () => await env.prepareEach());
    beforeEach(() => {
        repository = MedicalProfessionalRepositoryFactory.make(env.firestore);
    });
    afterEach(async () => await env.cleanupEach());

    function getSampleMedicalProfessional(): PendingMedicalProfessional {
        return {
            displayName: `displayname-${uuid()}`,
        };
    }

    describe("#add", function() {
        it("Adds mp to database", async () => {
            const sampleMedicalProfessional = getSampleMedicalProfessional();
            const { id } = await repository.add(sampleMedicalProfessional);
            const fetched = await repository.get(id);

            expect(fetched!.displayName).to.be.equal(sampleMedicalProfessional.displayName);
        });
    });

    describe("#update", function() {
        it("Changes fields", async () => {
            const sampleMedicalProfessional = getSampleMedicalProfessional();
            const { id } = await repository.add(sampleMedicalProfessional);
            const fetched = await repository.get(id);
            expect(fetched!.displayName).to.be.equal(sampleMedicalProfessional.displayName);

            await repository.update({ id, ...sampleMedicalProfessional, displayName: "changed" });
            const fetchedAfterUpdate = await repository.get(id);
            expect(fetchedAfterUpdate!.displayName).to.be.equal("changed");
        });
    });

    describe("#list", function() {
        it("Lists previously added doctors", async () => {
            const sampleMPs = _.range(0, 3).map(() => getSampleMedicalProfessional());
            for (const mp of sampleMPs) {
                await repository.add(mp);
            }

            const fetchedList = await repository.list();
            expect(fetchedList.length).to.be.equal(sampleMPs.length);
            expect(fetchedList.map(m => m.displayName)).to.have.members(sampleMPs.map(m => m.displayName));
        });
    });
});
