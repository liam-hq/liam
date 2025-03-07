import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend
import matplotlib.pyplot as plt

# Your data and plot code...
migration_safety = [9, 9, 9, 4, 4, 10, 8, 9, 10, 5, 10, 8, 10, 6, 8, 8, 10, 10, 9, 10, 5, 10, 9, 10, 8, 8, 2, 10, 8, 8, 10, 4, 2, 10]
data_integrity = [10, 10, 7, 6, 3, 10, 8, 10, 9, 4, 9, 8, 10, 7, 7, 7, 10, 10, 9, 10, 4, 10, 7, 10, 6, 9, 3, 10, 6, 9, 10, 3, 3, 10]
performance_impact = [8, 8, 8, 7, 10, 7, 9, 6, 8, 6, 7, 6, 6, 9, 6, 9, 9, 8, 7, 8, 9, 9, 9, 8, 8, 9, 9, 8, 7, 6, 8, 7]  # 32 values
project_rules = [9, 9, 6, 5, 5, 10, 9, 9, 7, 6, 7, 9, 7, 8, 7, 7, 10, 8, 6, 8, 6, 8, 8, 9, 7, 7, 4, 9, 7, 7, 9, 5, 4, 9]
security_scalability = [7, 9, 6, 9, 7, 8, 8, 7, 8, 7, 8, 7, 8, 7, 10, 10, 7, 9, 7, 9, 6, 8, 8, 8, 7, 8, 8, 8, 8, 5, 7, 8]  # 32 values

data = [migration_safety, data_integrity, performance_impact, project_rules, security_scalability]
labels = ['Migration Safety', 'Data Integrity', 'Performance Impact', 'Project Rules Consistency', 'Security/Scalability']

plt.figure(figsize=(10, 6))
plt.boxplot(data, labels=labels, patch_artist=True)
plt.title("Evaluation Scores Across 34 Reviews")
plt.ylabel("Score")
plt.grid(True, axis='y', linestyle='--', alpha=0.7)

# Save the plot as PNG instead of showing it interactively
plt.savefig("boxplot.png")
