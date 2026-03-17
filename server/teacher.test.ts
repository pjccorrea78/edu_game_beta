import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Teacher Panel CRUD", () => {
  let caller: any;
  let sessionId: string;

  beforeAll(async () => {
    const ctx: TrpcContext = { user: null, req: null, res: null };
    caller = appRouter.createCaller(ctx);
    sessionId = `test-session-${Date.now()}`;
  });

  it("should create a school", async () => {
    const result = await caller.teacher.createSchool({
      sessionId,
      name: "Escola Teste",
      city: "Fortaleza",
      state: "CE",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe("Escola Teste");
    expect(result.city).toBe("Fortaleza");
    expect(result.state).toBe("CE");
  });

  it("should list schools for teacher", async () => {
    // First create a school
    const school = await caller.teacher.createSchool({
      sessionId,
      name: "Escola Listagem",
      city: "São Paulo",
      state: "SP",
    });

    // Then list schools
    const schools = await caller.teacher.listSchools({ sessionId });

    expect(Array.isArray(schools)).toBe(true);
    expect(schools.length).toBeGreaterThan(0);
    const found = schools.find((s: any) => s.id === school.id);
    expect(found).toBeDefined();
  });

  it("should create a class in a school", async () => {
    // Create school first
    const school = await caller.teacher.createSchool({
      sessionId,
      name: "Escola com Turma",
      city: "Rio de Janeiro",
      state: "RJ",
    });

    // Create class
    const cls = await caller.teacher.createClass({
      sessionId,
      schoolId: school.id,
      name: "5º Ano A",
      grade: "5",
      year: 2026,
    });

    expect(cls).toBeDefined();
    expect(cls.id).toBeGreaterThan(0);
    expect(cls.name).toBe("5º Ano A");
    expect(cls.grade).toBe("5");
    expect(cls.schoolId).toBe(school.id);
  });

  it("should list classes for a school", async () => {
    // Create school and class
    const school = await caller.teacher.createSchool({
      sessionId,
      name: "Escola com Classes",
      city: "Brasília",
      state: "DF",
    });

    const cls = await caller.teacher.createClass({
      sessionId,
      schoolId: school.id,
      name: "6º Ano B",
      grade: "6",
      year: 2026,
    });

    // List classes
    const classes = await caller.teacher.listClasses({ sessionId, schoolId: school.id });

    expect(Array.isArray(classes)).toBe(true);
    expect(classes.length).toBeGreaterThan(0);
    const found = classes.find((c: any) => c.id === cls.id);
    expect(found).toBeDefined();
  });



  it("should get class details with students", async () => {
    // Create school and class
    const school = await caller.teacher.createSchool({
      sessionId,
      name: "Escola Detalhes",
      city: "Manaus",
      state: "AM",
    });

    const cls = await caller.teacher.createClass({
      sessionId,
      schoolId: school.id,
      name: "3º Ano D",
      grade: "3",
      year: 2026,
    });

    // Get class details
    const classDetails = await caller.teacher.getClass({ sessionId, classId: cls.id });

    expect(classDetails).toBeDefined();
    expect(classDetails.class).toBeDefined();
    expect(classDetails.class.id).toBe(cls.id);
    expect(Array.isArray(classDetails.students)).toBe(true);
  });
});
