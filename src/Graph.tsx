import { useRef, useEffect } from "react";
import * as d3 from "d3";

const NODE_RADIUS = 18; // Update this to the actual radius of your buttons
const ACTIVE_RADIUS = 25;
const NODE_PADDING = 2.5; // Update this to the padding between buttons
const SVG_WIDTH = 588; // Update this to the width of your SVG
const SVG_HEIGHT = 200; // Update this to the height of your SVG
const SPACE_BETWEEN_NODES = 0;

// we can compute the percentage you can scale it up
const activeUpscale = (NODE_RADIUS + 2 * SPACE_BETWEEN_NODES) / NODE_RADIUS;

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
  active: boolean;
  avatarUrl: string;
};

export function Graph({ people }: { people: FakePerson[] }) {
  const d3Container = useRef(null);
  const simulation = useRef<d3.Simulation<Node, undefined>>();

  useEffect(() => {
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
      ({ value, certainty, active, avatarUrl }) => ({
        x: value,
        y: SVG_HEIGHT / 2, // Assuming you want them all on the same vertical position
        certainty,
        active,
        avatarUrl,
      })
    );

    // Define a function to determine the radius of each node
    const getNodeRadius = (d: Node) => (d.active ? ACTIVE_RADIUS : NODE_RADIUS);

    // Update the force simulation with the dynamic collision radius
    const simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX((d: Node) => xScale(d.x)).strength(1))
      .force("collide", d3.forceCollide(getNodeRadius).strength(1))
      .stop(); // We must stop the simulation so we can run it manually

    // Manually run the simulation to completion in a tight loop
    for (let i = 0; i < 120; ++i) simulation.tick();

    // After the simulation, use the updated positions to set the elements
    const buttonGroup = svg
      .selectAll("g.button")
      .data(nodes)
      .enter()
      .append("g")
      .attr(
        "class",
        (d) => `graph-button ${d.certainty} ${d.active ? "active" : ""}`
      )
      .attr("cursor", "pointer")
      .attr("tabindex", 0)
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (d) => {
        console.log("Button clicked:", d);
      });

    buttonGroup.append("circle").attr("r", getNodeRadius);

    const imagePosition = (d: Node) =>
      d.active ? -ACTIVE_RADIUS + NODE_PADDING : -NODE_RADIUS + NODE_PADDING;
    const imageSize = (d: Node) =>
      d.active
        ? ACTIVE_RADIUS * 2 - NODE_PADDING * 2
        : NODE_RADIUS * 2 - NODE_PADDING * 2;

    buttonGroup
      .append("image")
      .attr("href", (d) => d.avatarUrl)
      .attr("x", imagePosition)
      .attr("y", imagePosition)
      .attr("width", imageSize)
      .attr("height", imageSize)
      .style("clip-path", "inset(0% round 50%)");

    return () => {};
  }, [people]); // Redraw graph when numbers change

  return (
    <svg
      className="graph"
      style={{ "--active-upscale": activeUpscale } as React.CSSProperties}
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      ref={d3Container}
    />
  );
}
