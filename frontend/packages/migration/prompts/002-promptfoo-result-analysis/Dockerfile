# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install matplotlib
RUN pip install matplotlib

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY script.py /app/script.py

# Run script.py when the container launches
CMD ["python", "script.py"]
