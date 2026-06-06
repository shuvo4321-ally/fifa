import { MATCHES as matches1986 } from "./matches";
import { MATCHES as matches1990 } from "./matches1990";
import { MATCHES as matches1994 } from "./matches1994";
import { MATCHES as matches1998 } from "./matches1998";
import { MATCHES as matches2002 } from "./matches2002";
import { MATCHES as matches2006 } from "./matches2006";

export const ALL_MATCHES = [
  ...matches1986.map(m => ({ ...m, year: "1986" })),
  ...matches1990.map(m => ({ ...m, year: "1990" })),
  ...matches1994.map(m => ({ ...m, year: "1994" })),
  ...matches1998.map(m => ({ ...m, year: "1998" })),
  ...matches2002.map(m => ({ ...m, year: "2002" })),
  ...matches2006.map(m => ({ ...m, year: "2006" })),
];
