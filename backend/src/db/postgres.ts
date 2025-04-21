import postgres from "postgres";

const sql = postgres(
  "postgres://user:senha@ip/banco",
);
export default sql;
