FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.local/bin:/root/.hermes/hermes-agent/venv/bin:$PATH"

RUN apt-get update && apt-get install -y \
    curl \
    git \
    xz-utils \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root

# Install Hermes Agent (skip browser agar ringan di cloud free tier)
RUN curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --skip-browser

COPY entrypoint.sh /root/entrypoint.sh
RUN chmod +x /root/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/root/entrypoint.sh"]
