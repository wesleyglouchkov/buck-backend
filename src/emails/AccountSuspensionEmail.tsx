import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface AccountSuspensionEmailProps {
    username?: string;
}

export const AccountSuspensionEmail = ({
    username = "User",
}: AccountSuspensionEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Buck - Account Suspension</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section>
                        <Text style={text}>Hi {username},</Text>
                        <Text style={text}>
                            We are writing to inform you that your account has been suspended due to violations of our community guidelines.
                        </Text>
                        <Text style={text}>
                            If you believe this suspension was issued in error, please contact our support team immediately.
                        </Text>
                        <Text style={text}>
                            <small style={smallText}>
                                This is an automated message. Please do not reply to this email.
                            </small>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AccountSuspensionEmail;

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
    margin: "16px 0",
};

const smallText = {
    fontSize: "14px",
    color: "#666",
    margin: 0,
};
