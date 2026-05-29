console.time("quote");
for (let i = 0; i < 10000; i++) {
  Math.sqrt(i);
}
console.timeEnd("quote");
