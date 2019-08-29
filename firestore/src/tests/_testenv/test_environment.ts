import BluebirdPromise from "bluebird";
import { expect, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as sinon from "sinon";
import uuid from "uuid/v4";
chaiUse(chaiAsPromised);

export { expect, uuid, _, sinon, BluebirdPromise };
