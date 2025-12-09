import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    userFirstname?: string;
}

export const WelcomeEmail = ({
    userFirstname = "User",
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Buck</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section>
                        <Text style={text}>Hi {userFirstname},</Text>
                        <Text style={text}>
                            Welcome to Buck! We're excited to have you on board.
                        </Text>
                        <Text style={text}>
                            Here are a few things you can do to get started:
                        </Text>
                        <Button style={button} href={`${process.env.FRONTEND_URL || 'http://localhost:3000'}/explore`}>
                            Go to your Discover page
                        </Button>
                        <Text style={text}>
                            If you have any questions, feel free to reply to this email. We're here to help!
                        </Text>
                        <Text style={text}>
                            Thanks,
                            <br />
                            The Buck Team
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeEmail;

const main = {
    backgroundColor: "#f6f9fc",
    padding: "10px 0",
};

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #f0f0f0",
    padding: "45px",
};

const text = {
    fontSize: "16px",
    fontFamily:
        "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    fontWeight: "300",
    color: "#404040",
    lineHeight: "26px",
};

const button = {
    backgroundColor: "#007ee6",
    borderRadius: "4px",
    color: "#fff",
    fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "210px",
    padding: "14px 7px",
};
