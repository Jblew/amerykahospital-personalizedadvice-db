import { expect, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import uuid from "uuid/v4";

chaiUse(chaiAsPromised);

export { expect, uuid };
