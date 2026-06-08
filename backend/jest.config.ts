export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^(\\.\\.?\\/.+)\\.js$": "$1"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        module: "NodeNext",
        moduleResolution: "NodeNext"
      }
    }]
  }
};
