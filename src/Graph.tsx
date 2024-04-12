import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const NODE_RADIUS = 18;
const ACTIVE_RADIUS = 58 / 2;
const NODE_PADDING = 2.5;
const DRAW_WIDTH = 588;
const DRAW_HEIGHT = 200;
const PAD_BOTTOM = 20;
const SVG_HEIGHT = DRAW_HEIGHT + PAD_BOTTOM;
const TRANSITION_DURATION = 800;

const imgPosition = -NODE_RADIUS + NODE_PADDING;
const imgSize = NODE_RADIUS * 2 - NODE_PADDING * 2;
const activeImgPosition = -ACTIVE_RADIUS + NODE_PADDING;
const activeImgSize = ACTIVE_RADIUS * 2 - NODE_PADDING * 2;

// Set up your scales
const xScale = d3
  .scaleLinear()
  .domain([0, 100])
  .range([NODE_RADIUS, DRAW_WIDTH - NODE_RADIUS]);

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
  radius: number;
  active: boolean;
};

export function Graph({
  people,
  setActiveIndex,
}: {
  people: FakePerson[];
  setActiveIndex: (index: number) => void;
}) {
  const d3Container = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [initialPositions, setInitialPositions] = useState<Node[]>([]);

  // Initialization to set default sizes
  useEffect(() => {
    if (initialized) return;

    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);

    // Clear the SVG to re-render it on update
    svg.selectAll("*").remove();

    // Add accent lines at every 10%
    for (let i = 0; i <= 100; i += 5) {
      if (i % 10 === 0) {
        svg
          .append("line")
          .attr("x1", xScale(i))
          .attr("y1", 0)
          .attr("x2", xScale(i))
          .attr("y2", DRAW_HEIGHT) // Assuming the height of your SVG is 100
          .attr("stroke", "#EEF2F5") // Style as needed
          .attr("stroke-width", 2);
      }

      if (i % 50 === 0) {
        // Append text for the percentage
        svg
          .append("text")
          .attr("x", xScale(i)) // Position the text slightly to the right of the line
          .attr("y", SVG_HEIGHT) // Position the text at the bottom of the SVG
          .attr("dx", "0.35em")
          .attr("dy", "-0.35em") // Adjust the position slightly above the bottom edge
          .attr("text-anchor", "middle") // Center the text on the x position
          .style("font-family", "Inter") // Apply the "Inter" font
          .style("font-size", "14px") // Set the font size
          .style("color", "#334553") // Set the text color
          .text(`${i}%`); // Set the text to the percentage value
      }
    }

    // Convert numbers to objects
    const nodes: Node[] = people.map(
      ({ value, certainty, avatarUrl }, index) => ({
        x: value,
        y: DRAW_HEIGHT / 2, // Assuming you want them all on the same vertical position
        certainty,
        id: index,
        avatarUrl,
        radius: NODE_RADIUS,
        active: false,
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

    // Save the initial positions for later
    setInitialPositions(nodes);

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
      .on("click", (_, d) => {
        setActiveIndex(d.id);
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
  }, [initialized, people, setActiveIndex]); // Redraw graph when numbers change

  // Separate useEffect to handle adjusting the size of the active element
  useEffect(() => {
    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);

    if (!initialized || initialPositions.length === 0) return;

    // Use the stored initial positions as the starting point for the simulation
    const updatedNodes = initialPositions.map((node, index) => ({
      ...node,
      x: people[index].active ? xScale(people[index].value) : node.x,
      // Set the radius based on active status
      radius: people[index].active ? ACTIVE_RADIUS : NODE_RADIUS,
      active: people[index].active,
    }));

    // Re-initialize the simulation
    const simulation = d3
      .forceSimulation(updatedNodes)
      .force("x", d3.forceX((d: Node) => d.x).strength(1))
      .force("collide", d3.forceCollide((d: Node) => d.radius).strength(1))
      .stop();

    // Manually run the simulation to completion in a tight loop
    for (let i = 0; i < 120; ++i) simulation.tick();

    // Update the positions and sizes of the nodes after the simulation
    svg
      .selectAll(".graph-button")
      .data(updatedNodes)
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeElastic.period(0.5))
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("data-is-active", (d) => d.active);

    svg
      .selectAll(".graph-button circle")
      .data(updatedNodes)
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeElastic.period(0.5))
      .attr("r", (d) => d.radius);

    svg
      .selectAll(".graph-button image")
      .data(updatedNodes)
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(d3.easeElastic.period(0.5))
      .attr("x", (d) => (d.active ? activeImgPosition : imgPosition))
      .attr("y", (d) => (d.active ? activeImgPosition : imgPosition))
      .attr("width", (d) => (d.active ? activeImgSize : imgSize))
      .attr("height", (d) => (d.active ? activeImgSize : imgSize));

    return () => {};
  }, [people, initialized, initialPositions]);

  return (
    <svg
      className="graph"
      width={DRAW_WIDTH}
      height={SVG_HEIGHT}
      ref={d3Container}
    />
  );
}
