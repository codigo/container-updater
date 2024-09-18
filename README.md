# Container Updater

Container Updater is a service designed to facilitate the updating of Docker services running in a Docker Swarm environment. It provides a secure API endpoint that allows authorized users to trigger updates for specific services.

## How It Works

1. **Authentication**: The service uses JWT (JSON Web Token) for authentication. Each request to update a service must include a valid JWT in the Authorization header.

2. **API Endpoint**: The service exposes a single POST endpoint at `/update`.

3. **Service Update Process**:
   - When a valid update request is received, the service first checks for the existence of the specified application in the Docker Swarm.
   - If found, it uses the Docker CLI to force an update of the service, which typically causes Docker Swarm to recreate the service's containers with the latest image.

4. **Docker Integration**: The service interacts with the Docker daemon on the host machine, allowing it to list and update Docker services.

5. **Logging**: Comprehensive logging is implemented throughout the application for monitoring and debugging purposes.

## Key Components

- **JWT Authentication Plugin**: Handles token verification and provides authentication middleware.
- **Docker Service Update Plugin**: Encapsulates the logic for updating Docker services.
- **Update Route**: Defines the API endpoint for triggering service updates.
- **Error Handling**: Utilizes Fastify's error handling capabilities to manage and report errors effectively.

## Usage

To update a service:

1. Obtain a valid JWT token (the process for this should be implemented separately).
2. Send a POST request to `/update` with the following:
   - Header: `Authorization: Bearer <your_jwt_token>`
   - Body: `{ "appName": "your-service-name" }`

## Security Considerations

- The service runs as a non-root user inside its Docker container.
- It requires access to the Docker socket, which should be carefully controlled.
- JWT secrets should be kept secure and rotated regularly.

## Development and Deployment

- The project uses TypeScript for type safety.
- Tests are written using Node's built-in test runner.
- A CI/CD pipeline is set up using GitHub Actions for automated testing and building.
- The service can be deployed as a Docker container, with the Docker socket mounted to allow interaction with the host's Docker daemon.

## Getting Started

Refer to the Installation and Running the Application sections for setup instructions.

## Contributing

Contributions are welcome! Please read the CONTRIBUTING.md file for guidelines on how to submit pull requests and report issues.

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details.

## Running as a Docker Container

To run this application as a Docker container, follow these steps:

1. Build the Docker image:

   ```bash
   docker build -t container-updater .
   ```

2. Run the container:

   ```bash
   docker run -d \
     -p 3000:3000 \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -e JWT_SECRET=your_jwt_secret_here \
     --name container-updater \
     container-updater
   ```

   Replace `your_jwt_secret_here` with your actual JWT secret.

   Note: Mounting the Docker socket (-v /var/run/docker.sock:/var/run/docker.sock) gives the container access to the host's Docker daemon. Use this with caution in production environments.

3. The application should now be running and accessible at `http://localhost:3000`.

Remember to secure your JWT_SECRET and never commit it to version control. In production environments, consider using Docker secrets or environment variables injected at runtime for sensitive information.
