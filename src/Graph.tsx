import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const NODE_RADIUS = 18;
const ACTIVE_RADIUS = 25;
const NODE_PADDING = 2.5;
const SVG_WIDTH = 588;
const SVG_HEIGHT = 200;

const imgPosition = -NODE_RADIUS + NODE_PADDING;
const imgSize = NODE_RADIUS * 2 - NODE_PADDING * 2;
const activeImgPosition = -ACTIVE_RADIUS + NODE_PADDING;
const activeImgSize = ACTIVE_RADIUS * 2 - NODE_PADDING * 2;

export type Certainty = "clear" | "related" | "editor";

export type FakePerson = {
  value: number;
  certainty: Certainty;
  active: boolean;
  avatarUrl: string;
};

type Node = {
  x: number;
  y: number;
  certainty: Certainty;
  avatarUrl: string;
  id: number;
};

export function Graph({ people }: { people: FakePerson[] }) {
  const d3Container = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // Initialization to set default sizes
  useEffect(() => {
    if (initialized) return;

    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);

    // Clear the SVG to re-render it on update
    svg.selectAll("*").remove();

    // Set up your scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([NODE_RADIUS, SVG_WIDTH - NODE_RADIUS]);

    // Add accent lines at every 10%
    for (let i = 0; i <= 100; i += 20) {
      svg
        .append("line")
        .attr("x1", xScale(i))
        .attr("y1", 0)
        .attr("x2", xScale(i))
        .attr("y2", SVG_HEIGHT) // Assuming the height of your SVG is 100
        .attr("stroke", "#ddd") // Style as needed
        .attr("stroke-width", 1);
    }

    // Convert numbers to objects
    const nodes: Node[] = people.map(
      ({ value, certainty, avatarUrl }, index) => ({
        x: value,
        y: SVG_HEIGHT / 2, // Assuming you want them all on the same vertical position
        certainty,
        id: index,
        avatarUrl,
      })
    );

    // Define a function to determine the radius of each node
    // const getNodeRadius = (d: Node) => (d.active ? ACTIVE_RADIUS : NODE_RADIUS);

    // Update the force simulation with the dynamic collision radius
    const simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX((d: Node) => xScale(d.x)).strength(1))
      .force("collide", d3.forceCollide(NODE_RADIUS).strength(1))
      .stop(); // We must stop the simulation so we can run it manually

    // Manually run the simulation to completion in a tight loop
    for (let i = 0; i < 120; ++i) simulation.tick();

    // After the simulation, use the updated positions to set the elements
    const buttonGroup = svg
      .selectAll("g.button")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", (d) => `graph-button ${d.certainty}`)
      .attr("data-id", (d) => d.id)
      .attr("cursor", "pointer")
      .attr("tabindex", 0)
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (d) => {
        console.log("Button clicked:", d);
      });

    buttonGroup.append("circle").attr("r", NODE_RADIUS);

    buttonGroup
      .append("image")
      .attr("href", (d) => d.avatarUrl)
      .attr("x", imgPosition)
      .attr("y", imgPosition)
      .attr("width", imgSize)
      .attr("height", imgSize)
      .style("clip-path", "inset(0% round 50%)");

    setInitialized(true);

    return () => {};
  }, [initialized, people]); // Redraw graph when numbers change

  // Separate useEffect to handle adjusting the size of the active element
  useEffect(() => {
    console.log("Setting Active Element");

    if (!initialized) return;
    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);

    // get the index of the active element
    const activeIndex = people.findIndex((person) => person.active);

    // Select the active element
    const activeElement = svg.select(`.graph-button[data-id="${activeIndex}"]`);

    // Update the active element size
    activeElement.select("circle").attr("r", ACTIVE_RADIUS);

    // Update the active element image size
    activeElement
      .select("image")
      .attr("x", activeImgPosition)
      .attr("y", activeImgPosition)
      .attr("width", activeImgSize)
      .attr("height", activeImgSize);

    // Make sure to reset the size of the other elements
    svg
      .selectAll(".graph-button")
      .filter((d, i) => i !== activeIndex)
      .select("circle")
      .attr("r", NODE_RADIUS);

    svg
      .selectAll(".graph-button")
      .filter((d, i) => i !== activeIndex)
      .select("image")
      .attr("x", imgPosition)
      .attr("y", imgPosition)
      .attr("width", imgSize)
      .attr("height", imgSize);

    return () => {};
  }, [people, initialized]);

  return (
    <svg
      className="graph"
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      ref={d3Container}
    />
  );
}
