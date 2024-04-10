import { useRef, useEffect } from "react";
import * as d3 from "d3";

const buttonRadius = 17; // Update this to the actual radius of your buttons
const buttonPadding = 3; // Update this to the padding between buttons
const width = 588; // Update this to the width of your SVG
const height = 200; // Update this to the height of your SVG

export type Certainty = "clear" | "related" | "editor";

export type FakePerson = {
  value: number;
  certainty: Certainty;
  active: boolean;
  avatarUrl: string;
};

export function Graph({ people }: { people: FakePerson[] }) {
  const d3Container = useRef(null);

  useEffect(() => {
    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);

    // Clear the SVG to re-render it on update
    svg.selectAll("*").remove();

    // Set up your scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([buttonRadius, width - buttonRadius]); // Assuming SVG width is 300

    // Add super light accent lines every 1%
    // for (let i = -5; i <= 105; i++) {
    //   svg
    //     .append("line")
    //     .attr("x1", xScale(i))
    //     .attr("y1", 0)
    //     .attr("x2", xScale(i))
    //     .attr("y2", height) // Assuming the height of your SVG is 100
    //     .attr("stroke", "#eee") // Style as needed
    //     .attr("stroke-width", 1);
    // }

    // Add accent lines at every 10%
    for (let i = 0; i <= 100; i += 20) {
      svg
        .append("line")
        .attr("x1", xScale(i))
        .attr("y1", 0)
        .attr("x2", xScale(i))
        .attr("y2", height) // Assuming the height of your SVG is 100
        .attr("stroke", "#ddd") // Style as needed
        .attr("stroke-width", 1);
    }

    // Convert numbers to objects
    const nodes = people.map(({ value, certainty, active, avatarUrl }) => ({
      x: value,
      y: height / 2, // Assuming you want them all on the same vertical position
      certainty,
      active,
      avatarUrl,
    }));

    // Create a force simulation for the horizontal axis
    // and prevent circles from overlapping
    const simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX((d: any) => xScale(d.x)).strength(1))
      .force("collide", d3.forceCollide(buttonRadius)) // Updated radius to prevent overlap
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
      })
      .append("g");

    buttonGroup.append("circle").attr("r", buttonRadius);

    buttonGroup
      .append("image")
      .attr("href", (d) => d.avatarUrl)
      .attr("x", -buttonRadius + buttonPadding)
      .attr("y", -buttonRadius + buttonPadding)
      .attr("width", buttonRadius * 2 - buttonPadding * 2)
      .attr("height", buttonRadius * 2 - buttonPadding * 2)
      .attr("clip-path", "url(#avatar-clip)");

    // Append a defs block for the clip-path
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "avatar-clip")
      .append("circle")
      .attr("r", buttonRadius - buttonPadding);
  }, [people]); // Redraw graph when numbers change

  return (
    <svg className="graph" width={width} height={height} ref={d3Container} />
  );
}
