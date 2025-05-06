import "reflect-metadata";
import "./index.css";
import { Application } from "@/app";

async function main(): Promise<void> {
  new Application();
}

jQuery(() => main().then(() => {}));
