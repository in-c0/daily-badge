// Entry module. Only the default handler may be exported from here: the Workers
// runtime treats every named export as a handler and fails to start otherwise
// ("Incorrect type for map entry ... not of type 'function or ExportedHandler'").
import { handle } from "./app.js";

export default {
  fetch(request) {
    return handle(request);
  },
};
