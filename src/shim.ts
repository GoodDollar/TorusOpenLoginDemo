import { Buffer } from "buffer";
import process from "process/browser";

global.Buffer = global.Buffer || Buffer;
global.process = global.process || process;
