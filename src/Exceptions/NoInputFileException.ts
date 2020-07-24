export default class NoInputFileException extends Error {
  constructor() {
    super("No input file specified!");
  }
}
