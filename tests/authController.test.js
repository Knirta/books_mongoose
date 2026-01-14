import { describe, test, expect, jest, afterEach } from "@jest/globals";

const mockFindOne = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockCompare = jest.fn();
const mockSign = jest.fn();

import ctrl from "../controllers/authController.js";
import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

User.findOne = mockFindOne;
User.findByIdAndUpdate = mockFindByIdAndUpdate;

bcrypt.compare = mockCompare;
jwt.sign = mockSign;

const mockReq = (body = {}) => ({
  body,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

const mockNext = jest.fn();

describe("login controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should login user and return token", async () => {
    const req = mockReq({
      email: "kate@gmail.com",
      password: "kate1234",
    });

    const res = mockRes();

    const user = {
      _id: "123",
      email: "kate@gmail.com",
      password: "hashedPassword",
    };

    mockFindOne.mockResolvedValue(user);
    mockFindByIdAndUpdate.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue("fake-token");

    await ctrl.login(req, res, mockNext);

    expect(mockFindOne).toHaveBeenCalledWith({ email: "kate@gmail.com" });

    expect(bcrypt.compare).toHaveBeenCalledWith("kate1234", "hashedPassword");

    expect(jwt.sign).toHaveBeenCalled();

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("123", {
      token: "fake-token",
    });

    expect(res.json).toHaveBeenCalledWith({ token: "fake-token" });
  });

  test("should return 401 if user not found", async () => {
    const req = mockReq({
      email: "kate@gmail.com",
      password: "kate1234",
    });

    const res = mockRes();

    mockFindOne.mockResolvedValue(null);

    await ctrl.login(req, res, mockNext);

    expect(mockFindOne).toHaveBeenCalledWith({ email: "kate@gmail.com" });
    expect(mockNext).toHaveBeenCalled();

    const err = mockNext.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(401);
    expect(err.message).toBe("Email or password is invalid");
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should return 401 if password is invalid", async () => {
    const req = mockReq({
      email: "kate@gmail.com",
      password: "katekate12345",
    });
    const res = mockRes();

    const user = {
      _id: "123",
      email: "kate@gmail.com",
      password: "hashedPassword",
    };

    mockFindOne.mockResolvedValue(user);

    mockCompare.mockResolvedValue(false);

    await ctrl.login(req, res, mockNext);

    expect(mockFindOne).toHaveBeenCalledWith({ email: "kate@gmail.com" });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "katekate12345",
      "hashedPassword"
    );
    expect(mockNext).toHaveBeenCalled();
    const err = mockNext.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(401);
    expect(err.message).toBe("Email or password is invalid");
    expect(res.status).not.toHaveBeenCalled();
  });
});
