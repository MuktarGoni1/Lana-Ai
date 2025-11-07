import pytest

from app.services.math_solver_service import is_math


@pytest.mark.parametrize(
    "text",
    [
        "Solve: 2x + 3 = 7",
        "simplify (x^2 + 2x + 1)",
        "factor 12x^3 - 6x^2",
        "expand (x+1)^3",
        "integrate sin(x)",
        "find derivative of x^2",
        "equation: y = 2x + 5",
        "sqrt(16)",
        "log(10)",
        "sin(x) + cos(x)",
        "matrix [[1,2],[3,4]]",
        "3+4-5*6/2",
    ],
)
def test_is_math_true(text):
    assert is_math(text) is True


@pytest.mark.parametrize(
    "text",
    [
        "What are photons?",
        "Explain photosynthesis",
        "Tell me a story",
        "Who discovered gravity?",
        "Describe the water cycle",
        "The capital of France",
        "This is a plain sentence without math",
    ],
)
def test_is_math_false(text):
    assert is_math(text) is False