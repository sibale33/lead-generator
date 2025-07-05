# Lead Generator 🚀

![Lead Generator](https://img.shields.io/badge/Lead%20Generator-v1.0.0-blue.svg)  
[![GitHub Releases](https://img.shields.io/badge/releases-latest%20release-orange.svg)](https://github.com/sibale33/lead-generator/releases)

Welcome to the Lead Generator repository! This powerful CLI tool and Node.js module enables you to send mass lead emails with AI-powered personalization and automate voice cold-calling. This README will guide you through installation, usage, features, and more.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Commands](#commands)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **AI-Powered Personalization**: Tailor your emails to each recipient using advanced AI algorithms.
- **Mass Email Sending**: Send thousands of emails with just a few commands.
- **Automated Voice Cold-Calling**: Engage leads through automated voice calls.
- **Easy Integration**: Works seamlessly with Mailgun and other APIs.
- **Command Line Interface**: Control everything from your terminal.

## Installation

To get started with Lead Generator, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/sibale33/lead-generator.git
   cd lead-generator
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Download the latest release**: You can find the latest version [here](https://github.com/sibale33/lead-generator/releases). Download the appropriate file and execute it.

## Usage

After installation, you can start using Lead Generator. Here’s a simple example of how to send personalized emails:

```bash
node lead-generator send --file leads.csv --template template.html
```

This command will read your leads from a CSV file and use the specified HTML template to send emails.

## Configuration

Before you can send emails or make calls, you need to configure your settings. Create a configuration file named `config.json` in the root directory:

```json
{
  "mailgun": {
    "apiKey": "YOUR_API_KEY",
    "domain": "YOUR_DOMAIN"
  },
  "voice": {
    "apiKey": "YOUR_VOICE_API_KEY"
  }
}
```

Replace `YOUR_API_KEY` and `YOUR_DOMAIN` with your Mailgun credentials, and `YOUR_VOICE_API_KEY` with your voice API credentials.

## Commands

Here are some of the main commands you can use:

### Send Emails

To send emails, use the following command:

```bash
node lead-generator send --file leads.csv --template template.html
```

### Make Voice Calls

To initiate voice calls, use:

```bash
node lead-generator call --file leads.csv --message "Hello, this is a test call."
```

### Check Status

To check the status of your last operation:

```bash
node lead-generator status
```

## Contributing

We welcome contributions! If you want to help improve Lead Generator, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please reach out via the GitHub Issues section or contact the maintainers directly.

You can find the latest releases [here](https://github.com/sibale33/lead-generator/releases). Make sure to download the necessary files and execute them for the best experience.

---

Thank you for checking out Lead Generator! We hope this tool helps you in your lead generation efforts. Happy emailing and calling!