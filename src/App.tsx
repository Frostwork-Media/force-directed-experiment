import { useCallback, useState } from "react";
import "./App.css";
import { Certainty, FakePerson, Graph } from "./Graph";
import { faker } from "@faker-js/faker";

function App() {
  const [people, setPeople] = useState(() => generate());
  const nextActivePerson = useCallback(() => {
    const newPeople = [...people];
    const activeIndex = newPeople.findIndex((p) => p.active);
    newPeople[activeIndex].active = false;
    const newActiveIndex = (activeIndex + 1) % newPeople.length;
    newPeople[newActiveIndex].active = true;
    setPeople(newPeople);
  }, [people]);

  const setActiveIndex = useCallback(
    (index: number) => {
      const newPeople = people.map((p, i) => ({
        ...p,
        active: i === index,
      }));
      setPeople(newPeople);
    },
    [people]
  );
  return (
    <div>
      <button
        onClick={() => setPeople(generate())}
        style={{
          display: "block",
          margin: "0 auto",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Generate new set
      </button>
      <button
        onClick={nextActivePerson}
        style={{
          display: "block",
          margin: "0 auto",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Change Active Element
      </button>

      <Graph people={people} setActiveIndex={setActiveIndex} />
      {/* <pre>{JSON.stringify(people, null, 2)}</pre> */}
    </div>
  );
}

export default App;

/**
 * Returns an array of random length
 * of numbers between 1 and 100
 */
function generate() {
  const length = Math.floor(Math.random() * 50) + 1;
  return Array.from({ length }, () => Math.floor(Math.random() * 100))
    .sort((a, b) => a - b)
    .map((n, i) => {
      const person: FakePerson = {
        value: n,
        certainty: getRandomCertainty(),
        active: i === 0,
        avatarUrl: faker.image.avatar(),
        name: faker.person.fullName(),
      };

      return person;
    });
}

function getRandomCertainty(): Certainty {
  const n = Math.random();
  if (n < 0.3333) {
    return "clear";
  } else if (n < 0.6666) {
    return "editor";
  } else {
    return "related";
  }
}
