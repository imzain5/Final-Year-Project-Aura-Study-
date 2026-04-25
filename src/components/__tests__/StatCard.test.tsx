import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookOpen, TrendingUp } from "lucide-react";
import StatCard from "../StatCard";

/**
 * Component tests for the StatCard dashboard widget.
 *
 * Following the React Testing Library philosophy advocated by Dodds (2019)
 * and cited in §6.1 of the dissertation, these tests assert on what the
 * user observes rather than on the component's internal implementation.
 */
describe("StatCard component", () => {
  it("renders its label and value", () => {
    render(
      <StatCard icon={BookOpen} label="Total Notes" value="42" />
    );
    expect(screen.getByText(/Total Notes/i)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a zero value without hiding it", () => {
    render(<StatCard icon={BookOpen} label="Quizzes Taken" value="0" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders a percentage value", () => {
    render(<StatCard icon={TrendingUp} label="Average Score" value="87%" />);
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("renders a change indicator when trend data is provided", () => {
    render(
      <StatCard
        icon={BookOpen}
        label="Notes"
        value="10"
        change="+20%"
        trend="up"
      />
    );
    expect(screen.getByText("+20%")).toBeInTheDocument();
  });

  it("omits change indicator when no change prop is provided", () => {
    const { container } = render(
      <StatCard icon={BookOpen} label="Notes" value="10" />
    );
    // No text matching "+"-prefixed percent should be present
    expect(container.textContent).not.toMatch(/\+\d+%/);
  });
});
