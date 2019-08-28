import { PendingSentSMS, SentSMSRepository } from "amerykahospital-personalizedadvice-businesslogic";

import { IntegrationTestsEnvironment } from "../../_test/IntegrationTestsEnvironment";
import { expect, uuid } from "../../_test/test_environment";

import { SentSMSRepositoryFactory } from "./SentSMSRepositoryFactory";

describe("SentSMSRepository", function() {
    this.timeout(6000);

    const env = new IntegrationTestsEnvironment();
    let repository: SentSMSRepository;
    beforeEach(async () => await env.prepareEach());
    beforeEach(() => {
        repository = SentSMSRepositoryFactory.make(env.firestore);
    });
    afterEach(async () => await env.cleanupEach());

    function getSampleSentSMS(): PendingSentSMS {
        return {
            phoneNumber: (Math.floor(Math.random() * 10 ** 9) + "").padStart(9, "0"),
            message: `msg-${uuid()}`,
            result: `result-${uuid()}`,
        };
    }

    describe("#add", function() {
        it("Adds sent sms to firestore", async () => {
            const sampleSentSMS = getSampleSentSMS();
            const { id } = await repository.add(sampleSentSMS);
            const fetched = await repository.get(id);

            expect(fetched!.message).to.be.equal(sampleSentSMS.message);
            expect(fetched!.phoneNumber).to.be.equal(sampleSentSMS.phoneNumber);
            expect(fetched!.result).to.be.equal(sampleSentSMS.result);
        });

        it("Appends current timestamp", async () => {
            const sampleSentSMS = getSampleSentSMS();
            const { id } = await repository.add(sampleSentSMS);
            const fetched = await repository.get(id);

            expect(fetched!.timestamp).to.be.approximately(Date.now() / 1000, 5);
        });
    });
});
