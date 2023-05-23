import bcrypt from "bcrypt";

const { hashSync, compareSync } = bcrypt;

export const hash = (password) => hashSync(password, 10);

export const check = (password, hashedpassword) =>
    compareSync(password, hashedpassword);
