import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
} from "@react-email/components";
import * as React from "react";

interface HelpRequestEmailProps {
    name: string;
    email: string;
    phone: string;
    country: string;
    issue: string;
}

export const HelpRequestEmail = ({
    name,
    email,
    phone,
    country,
    issue,
}: HelpRequestEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Buck - New Help Request from {name}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section>
                        <Heading style={h1}>Buck - New Help Request</Heading>
                        <Text style={text}>
                            <strong>Name:</strong> {name}
                        </Text>
                        <Text style={text}>
                            <strong>Email:</strong> {email}
                        </Text>
                        <Text style={text}>
                            <strong>Phone:</strong> {phone}
                        </Text>
                        <Text style={text}>
                            <strong>Country:</strong> {country}
                        </Text>
                        <Hr style={hr} />
                        <Heading style={h2}>Issue Description:</Heading>
                        <Text style={paragraph}>{issue}</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default HelpRequestEmail;

const main = {
    backgroundColor: "#f6f9fc",
    padding: "10px 0",
};

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #f0f0f0",
    padding: "45px",
    maxWidth: "600px",
    margin: "0 auto",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "bold",
    fontFamily:
        "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    color: "#404040",
    margin: "0 0 20px 0",
};

const h2 = {
    fontSize: "20px",
    fontWeight: "bold",
    fontFamily:
        "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    color: "#404040",
    margin: "20px 0 10px 0",
};

const text = {
    fontSize: "16px",
    fontFamily:
        "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    fontWeight: "300",
    color: "#404040",
    lineHeight: "26px",
    margin: "5px 0",
};

const paragraph = {
    ...text,
    whiteSpace: "pre-wrap" as const,
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
};
